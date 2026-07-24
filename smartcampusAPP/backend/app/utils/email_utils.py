"""Email utility for sending emails with attachments via SMTP."""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from app.config import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
    SMTP_FROM_EMAIL, SMTP_FROM_NAME, TEST_EMAIL_OVERRIDE,
)

logger = logging.getLogger(__name__)


def send_email_with_attachment(
    to_email: str,
    subject: str,
    html_body: str,
    attachment_bytes: bytes,
    attachment_filename: str,
    vendor_name: str = "",
    cc: str = "",
    bcc: str = "",
) -> dict:
    """
    Send an email with a PDF attachment.

    During the testing phase, if TEST_EMAIL_OVERRIDE is set, the email is
    redirected to the test address regardless of the intended vendor email.
    The original vendor email is logged for traceability.

    ``cc`` and ``bcc`` are comma-separated email addresses.

    Returns a dict with ``success`` (bool) and ``message`` (str).
    """

    # Determine the actual recipient
    actual_recipient = TEST_EMAIL_OVERRIDE if TEST_EMAIL_OVERRIDE else to_email

    if not SMTP_USER or not SMTP_PASSWORD:
        msg = (
            f"SMTP credentials not configured. "
            f"Email to '{actual_recipient}' (vendor: {vendor_name}) was NOT sent."
        )
        logger.warning(msg)
        return {"success": False, "message": msg}

    if not actual_recipient:
        msg = "No recipient email address available."
        logger.warning(msg)
        return {"success": False, "message": msg}

    try:
        # Build the message
        msg = MIMEMultipart()
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg["To"] = actual_recipient
        msg["Subject"] = subject

        # Add CC header
        cc_list = [e.strip() for e in cc.split(",") if e.strip()] if cc else []
        if cc_list:
            msg["Cc"] = ", ".join(cc_list)

        # BCC addresses are not added to headers (by design) but included in sendmail recipients
        bcc_list = [e.strip() for e in bcc.split(",") if e.strip()] if bcc else []

        # Attach HTML body
        msg.attach(MIMEText(html_body, "html"))

        # Attach the PDF
        pdf_part = MIMEApplication(attachment_bytes, _subtype="pdf")
        pdf_part.add_header(
            "Content-Disposition", "attachment", filename=attachment_filename
        )
        msg.attach(pdf_part)

        # All recipients for sendmail
        all_recipients = [actual_recipient] + cc_list + bcc_list

        # Send
        logger.info(
            "Sending PO email to %s (CC: %s, BCC: %s, original vendor email: %s, vendor: %s)",
            actual_recipient, cc_list, bcc_list, to_email, vendor_name,
        )

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, all_recipients, msg.as_string())

        logger.info("Email sent successfully to %s", actual_recipient)
        return {
            "success": True,
            "message": f"Email sent successfully to {actual_recipient}",
        }

    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP authentication failed: {e}"
        logger.error(error_msg)
        return {"success": False, "message": error_msg}
    except smtplib.SMTPException as e:
        error_msg = f"SMTP error: {e}"
        logger.error(error_msg)
        return {"success": False, "message": error_msg}
    except Exception as e:
        error_msg = f"Unexpected error sending email: {e}"
        logger.error(error_msg, exc_info=True)
        return {"success": False, "message": error_msg}

def send_html_email(
    to_email: str,
    subject: str,
    html_body: str,
) -> dict:
    """
    Send an email with HTML body (no attachment).
    """
    actual_recipient = TEST_EMAIL_OVERRIDE if TEST_EMAIL_OVERRIDE else to_email

    if not SMTP_USER or not SMTP_PASSWORD:
        msg = f"SMTP credentials not configured. Email to '{actual_recipient}' was NOT sent."
        logger.warning(msg)
        return {"success": False, "message": msg}

    if not actual_recipient:
        msg = "No recipient email address available."
        logger.warning(msg)
        return {"success": False, "message": msg}

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg["To"] = actual_recipient
        msg["Subject"] = subject

        msg.attach(MIMEText(html_body, "html"))

        logger.info("Sending HTML email to %s", actual_recipient)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, [actual_recipient], msg.as_string())

        logger.info("HTML email sent successfully to %s", actual_recipient)
        return {
            "success": True,
            "message": f"Email sent successfully to {actual_recipient}",
        }

    except Exception as e:
        error_msg = f"Unexpected error sending HTML email: {e}"
        logger.error(error_msg, exc_info=True)
        return {"success": False, "message": error_msg}
