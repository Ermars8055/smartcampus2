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
from app.models import PMSchedule, UserRoleAssignment, Role

def send_pm_advance_emails():
    """
    Background job that runs daily to check if any department requires an advance
    email for their Preventive Maintenance schedule.
    """
    logger.info("Starting PM advance email job...")
    db: Session = SessionLocal()
    try:
        from app.utils.email_utils import send_html_email
        
        # All months in lowercase mapping to their integer values
        months_map = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }

        schedules = db.query(PMSchedule).filter(PMSchedule.advance_email_enabled == True).all()
        today = date.today()
        
        emails_sent = 0
        for schedule in schedules:
            target_months = []
            for month_name, month_num in months_map.items():
                if getattr(schedule, month_name):
                    target_months.append((month_name, month_num))
            
            for month_name, month_num in target_months:
                # Determine the year for the target month.
                # If the target month is next month, it could be in the next year.
                target_year = today.year
                if today.month > month_num:
                    target_year += 1 # Target month is next year
                elif today.month == month_num:
                    # If we are in the same month, we might have already missed it, 
                    # but check if we need to send for next year. Let's just look at the nearest future month.
                    target_year += 1
                
                first_day_of_target_month = date(target_year, month_num, 1)
                
                # Calculate send date
                send_date = None
                if schedule.advance_email_type == "One Month":
                    send_date = first_day_of_target_month - relativedelta(months=1)
                elif schedule.advance_email_type == "One Week":
                    send_date = first_day_of_target_month - timedelta(days=7)
                elif schedule.advance_email_type == "Custom Days" and schedule.advance_email_days:
                    send_date = first_day_of_target_month - timedelta(days=schedule.advance_email_days)
                
                if send_date == today:
                    # Time to send email!
                    recipients = set()
                    
                    # 1. Fetch Users by ID
                    if schedule.advance_email_users:
                        users = db.query(User).filter(User.id.in_(schedule.advance_email_users), User.is_active == True).all()
                        for u in users:
                            if u.email:
                                recipients.add(u.email)
                    
                    # 2. Fetch Users by Roles (need to check UserRoleAssignment in this tenant)
                    if schedule.advance_email_roles:
                        roles = db.query(Role).filter(Role.tenant_id == schedule.tenant_id, Role.code.in_(schedule.advance_email_roles)).all()
                        role_ids = [r.id for r in roles]
                        if role_ids:
                            assignments = db.query(UserRoleAssignment).filter(
                                UserRoleAssignment.tenant_id == schedule.tenant_id,
                                UserRoleAssignment.role_id.in_(role_ids)
                            ).all()
                            user_ids_from_roles = [a.user_id for a in assignments]
                            if user_ids_from_roles:
                                role_users = db.query(User).filter(User.id.in_(user_ids_from_roles), User.is_active == True).all()
                                for u in role_users:
                                    if u.email:
                                        recipients.add(u.email)
                    
                    if recipients:
                        month_capitalized = month_name.capitalize()
                        subject = f"Advance Notice: PM Scheduled for {schedule.department_name} in {month_capitalized} {target_year}"
                        html_body = f"""
                        <html>
                            <body>
                                <h2>Preventive Maintenance Advance Notice</h2>
                                <p>This is an automated notification to inform you that Preventive Maintenance is scheduled for the <strong>{schedule.department_name}</strong> department in <strong>{month_capitalized} {target_year}</strong>.</p>
                                <p>Please ensure that all required preparations are made.</p>
                                <br/>
                                <p>Regards,<br/>SmartCampus Maintenance System</p>
                            </body>
                        </html>
                        """
                        for recipient in recipients:
                            send_html_email(to_email=recipient, subject=subject, html_body=html_body)
                            emails_sent += 1
                        logger.info(f"Sent {len(recipients)} PM advance emails for {schedule.department_name}.")
                    
    except Exception as e:
        logger.error(f"Failed to execute PM advance email job: {e}")
    finally:
        db.close()


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
    
    scheduler.start()
    logger.info("Scheduler started successfully.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shutdown complete.")
