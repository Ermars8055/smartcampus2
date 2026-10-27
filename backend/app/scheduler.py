import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Tenant, Site, User

logger = logging.getLogger(__name__)

def run_monthly_maintenance_generation():
    """
    Background job that runs on the 1st of every month to automatically
    generate Preventive Maintenance and Calibration complaints based on the schedules.
    """
    logger.info("Starting monthly maintenance generation job...")
    db: Session = SessionLocal()
    try:
        # Find a system user (platform admin) to attribute the creations to
        system_user = db.query(User).filter(User.is_platform_admin == True).first()
        user_id = system_user.id if system_user else 1

        # We must import here to avoid circular imports during startup
        from app.routers.equipment import _auto_generate_calls

        # Iterate over all active tenants
        tenants = db.query(Tenant).filter(Tenant.status == "Active").all()
        total_pm = 0
        total_cal = 0
        
        for tenant in tenants:
            # Iterate over all active sites for this tenant
            sites = db.query(Site).filter(Site.tenant_id == tenant.id, Site.is_active == True).all()
            for site in sites:
                try:
                    pm_count, cal_count = _auto_generate_calls(db, tenant.id, site.id, user_id)
                    total_pm += pm_count
                    total_cal += cal_count
                except Exception as e:
                    logger.error(f"Error generating calls for Tenant {tenant.id} Site {site.id}: {e}")

        logger.info(f"Monthly maintenance generation complete. Created {total_pm} PM calls and {total_cal} Calibration calls.")
    except Exception as e:
        logger.error(f"Failed to execute monthly maintenance generation job: {e}")
    finally:
        db.close()


from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from app.models import PMSchedule, UserRoleAssignment, Role, EquipmentItem, TenantConfiguration
from app.utils.notification_templates import build_calibration_reminder_email, build_pm_advance_email
from app.utils.email_utils import send_html_email


def _get_recipient_emails(db: Session, tenant_id: int, user_ids: list, role_codes: list) -> set:
    """Helper to resolve recipient email addresses from user IDs and role codes."""
    recipients = set()
    
    # 1. Fetch Users by ID
    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids), User.is_active == True).all()
        for u in users:
            if u.email:
                recipients.add(u.email.strip())
                
    # 2. Fetch Users by Roles
    if role_codes:
        roles = db.query(Role).filter(Role.tenant_id == tenant_id, Role.code.in_(role_codes)).all()
        role_ids = [r.id for r in roles]
        if role_ids:
            assignments = db.query(UserRoleAssignment).filter(
                UserRoleAssignment.tenant_id == tenant_id,
                UserRoleAssignment.role_id.in_(role_ids)
            ).all()
            user_ids_from_roles = [a.user_id for a in assignments]
            if user_ids_from_roles:
                role_users = db.query(User).filter(User.id.in_(user_ids_from_roles), User.is_active == True).all()
                for u in role_users:
                    if u.email:
                        recipients.add(u.email.strip())
                        
    return recipients


def send_calibration_advance_emails(tenant_id: int = None) -> dict:
    """
    Background job that runs daily to check for equipment approaching their scheduled
    calibration date and dispatches multi-tier advance reminder digests.
    """
    logger.info("Starting Calibration advance email job...")
    db: Session = SessionLocal()
    today = date.today()
    total_emails_sent = 0
    total_equipments_matched = 0

    try:
        query = db.query(TenantConfiguration).filter(TenantConfiguration.calibration_advance_email_enabled == True)
        if tenant_id:
            query = query.filter(TenantConfiguration.tenant_id == tenant_id)
        configs = query.all()

        for config in configs:
            tiers = config.calibration_advance_email_frequency_tiers or []
            if not tiers:
                # Default recommended tiers if not configured
                tiers = [
                    {"from_days": 60, "to_days": 50, "frequency_days": 7, "label": "Weekly (60-50 days)"},
                    {"from_days": 50, "to_days": 30, "frequency_days": 3, "label": "Every 3 days (50-30 days)"},
                    {"from_days": 30, "to_days": 0, "frequency_days": 1, "label": "Daily (<= 30 days)"}
                ]

            equipments = db.query(EquipmentItem).filter(
                EquipmentItem.tenant_id == config.tenant_id,
                EquipmentItem.status.in_(['Operational', 'Working', 'In Store']),
                EquipmentItem.calibration_required == True,
                EquipmentItem.next_calibration_due_date.isnot(None)
            ).all()

            matched_items = []
            for eq in equipments:
                due_date = eq.next_calibration_due_date
                days_rem = (due_date - today).days

                # Match against tiers
                for tier in tiers:
                    try:
                        from_d = int(tier.get("from_days", 0))
                        to_d = int(tier.get("to_days", 0))
                        freq = max(1, int(tier.get("frequency_days", 1)))
                        min_d = min(from_d, to_d)
                        max_d = max(from_d, to_d)

                        if min_d <= days_rem <= max_d:
                            if (max_d - days_rem) % freq == 0:
                                dept_name = eq.location.location_name if eq.location else (eq.location.department_name if eq.location and hasattr(eq.location, 'department_name') else "-")
                                eq_name = eq.material.name if eq.material else (eq.equipment_category or "Equipment")
                                make_model = f"{eq.make or ''} / {eq.model or ''}".strip(" /") or "-"
                                matched_items.append({
                                    "equipment_code": eq.equipment_code,
                                    "equipment_name": eq_name,
                                    "department": dept_name,
                                    "make_model": make_model,
                                    "serial_number": eq.serial_number or "-",
                                    "due_date": due_date,
                                    "days_remaining": days_rem
                                })
                                break
                    except (ValueError, TypeError):
                        continue

            if matched_items:
                total_equipments_matched += len(matched_items)
                matched_items.sort(key=lambda x: x["days_remaining"])
                recipients = _get_recipient_emails(
                    db,
                    config.tenant_id,
                    config.calibration_advance_email_users or [],
                    config.calibration_advance_email_roles or []
                )

                if recipients:
                    subject, html_body = build_calibration_reminder_email(matched_items)
                    for r in recipients:
                        send_html_email(to_email=r, subject=subject, html_body=html_body)
                        total_emails_sent += 1
                    logger.info(f"Sent {len(recipients)} Calibration reminder emails for {len(matched_items)} equipment items (Tenant {config.tenant_id}).")
                else:
                    logger.warning(f"Calibration notification triggered for {len(matched_items)} items, but no recipients configured for Tenant {config.tenant_id}.")

    except Exception as e:
        logger.error(f"Failed to execute Calibration advance email job: {e}")
    finally:
        db.close()

    return {
        "emails_sent": total_emails_sent,
        "equipment_notified": total_equipments_matched
    }


def send_pm_advance_emails(tenant_id: int = None) -> dict:
    """
    Background job that runs daily to check if any department requires an advance
    email for their Preventive Maintenance schedule.
    """
    logger.info("Starting PM advance email job...")
    db: Session = SessionLocal()
    today = date.today()
    emails_sent = 0

    try:
        months_map = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }

        query = db.query(TenantConfiguration).filter(TenantConfiguration.pm_advance_email_enabled == True)
        if tenant_id:
            query = query.filter(TenantConfiguration.tenant_id == tenant_id)
        configs = query.all()

        for config in configs:
            schedules = db.query(PMSchedule).filter(PMSchedule.tenant_id == config.tenant_id).all()
            custom_tiers = config.pm_advance_email_frequency_tiers or []

            for schedule in schedules:
                target_months = []
                for month_name, month_num in months_map.items():
                    if getattr(schedule, month_name):
                        target_months.append((month_name, month_num))

                for month_name, month_num in target_months:
                    # Determine year for target month
                    target_year = today.year
                    if today.month > month_num:
                        target_year += 1
                    elif today.month == month_num:
                        target_year += 1

                    first_day_of_target_month = date(target_year, month_num, 1)
                    days_remaining = (first_day_of_target_month - today).days

                    should_send = False

                    # Check custom frequency tiers if defined
                    if custom_tiers:
                        for tier in custom_tiers:
                            try:
                                from_d = int(tier.get("from_days", 0))
                                to_d = int(tier.get("to_days", 0))
                                freq = max(1, int(tier.get("frequency_days", 1)))
                                min_d = min(from_d, to_d)
                                max_d = max(from_d, to_d)

                                if min_d <= days_remaining <= max_d:
                                    if (max_d - days_remaining) % freq == 0:
                                        should_send = True
                                        break
                            except (ValueError, TypeError):
                                continue
                    else:
                        # Fallback to legacy options
                        types = config.pm_advance_email_types or []
                        send_dates = []
                        if "Before One Month" in types or "One Month" in types:
                            send_dates.append(first_day_of_target_month - relativedelta(months=1))
                        if "Before One Week" in types or "One Week" in types:
                            send_dates.append(first_day_of_target_month - timedelta(days=7))
                        if "Custom Days" in types and config.pm_advance_email_days:
                            send_dates.append(first_day_of_target_month - timedelta(days=config.pm_advance_email_days))

                        if today in send_dates:
                            should_send = True

                    if should_send:
                        recipients = _get_recipient_emails(
                            db,
                            config.tenant_id,
                            config.pm_advance_email_users or [],
                            config.pm_advance_email_roles or []
                        )

                        if recipients:
                            month_capitalized = month_name.capitalize()
                            subject, html_body = build_pm_advance_email(
                                department_name=schedule.department_name,
                                target_month=month_capitalized,
                                target_year=target_year,
                                days_remaining=days_remaining
                            )
                            for recipient in recipients:
                                send_html_email(to_email=recipient, subject=subject, html_body=html_body)
                                emails_sent += 1
                            logger.info(f"Sent {len(recipients)} PM advance emails for {schedule.department_name}.")

    except Exception as e:
        logger.error(f"Failed to execute PM advance email job: {e}")
    finally:
        db.close()

    return {"emails_sent": emails_sent}


scheduler = AsyncIOScheduler()

def start_scheduler():
    # Schedule the job to run on the 1st day of every month at 01:00 AM
    scheduler.add_job(
        run_monthly_maintenance_generation,
        trigger=CronTrigger(day=1, hour=1, minute=0),
        id="monthly_maintenance_job",
        replace_existing=True
    )
    
    # Schedule advance PM emails to run daily at 02:00 AM
    scheduler.add_job(
        send_pm_advance_emails,
        trigger=CronTrigger(hour=2, minute=0),
        id="pm_advance_emails_job",
        replace_existing=True
    )
    
    # Schedule advance Calibration emails to run daily at 02:15 AM
    scheduler.add_job(
        send_calibration_advance_emails,
        trigger=CronTrigger(hour=2, minute=15),
        id="calibration_advance_emails_job",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Scheduler started successfully with PM and Calibration notification jobs.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shutdown complete.")

