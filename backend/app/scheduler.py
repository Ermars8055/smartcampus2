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


scheduler = AsyncIOScheduler()

def start_scheduler():
    # Schedule the job to run on the 1st day of every month at 01:00 AM
    scheduler.add_job(
        run_monthly_maintenance_generation,
        trigger=CronTrigger(day=1, hour=1, minute=0),
        id="monthly_maintenance_job",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started successfully.")

def shutdown_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler shutdown complete.")
