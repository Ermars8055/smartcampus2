"""
Email notification templates for Scheduled Calibration and Preventive Maintenance (PM).
Designed with clean, responsive inline HTML styles for maximum email client compatibility.
"""

from typing import List, Dict, Any
from datetime import date


def build_calibration_reminder_email(
    items: List[Dict[str, Any]],
    recipient_name: str = "Team",
) -> tuple[str, str]:
    """
    Build subject and HTML body for Scheduled Calibration reminder digest.
    items is a list of dicts with:
      - equipment_code: str
      - equipment_name: str
      - department: str
      - make_model: str
      - serial_number: str
      - due_date: date or str
      - days_remaining: int
    """
    total_count = len(items)
    min_days = min(i.get("days_remaining", 0) for i in items) if items else 0
    
    if min_days <= 0:
        urgency_prefix = "URGENT: Calibration Due/Overdue"
    elif min_days <= 7:
        urgency_prefix = "ACTION REQUIRED: Calibration Due Soon"
    else:
        urgency_prefix = "Reminder: Scheduled Calibration Approaching"
        
    subject = f"{urgency_prefix} - {total_count} Equipment Item{'s' if total_count > 1 else ''}"

    # Build rows
    rows_html = ""
    for idx, item in enumerate(items, 1):
        days_rem = item.get("days_remaining", 0)
        due_str = item.get("due_date")
        if isinstance(due_str, (date,)):
            due_str = due_str.strftime("%d-%b-%Y")
        elif not due_str:
            due_str = "-"

        if days_rem < 0:
            badge = f'<span style="background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">Overdue ({abs(days_rem)} days)</span>'
        elif days_rem == 0:
            badge = f'<span style="background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">Due Today</span>'
        elif days_rem == 1:
            badge = f'<span style="background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">1 day left</span>'
        elif days_rem <= 7:
            badge = f'<span style="background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">{days_rem} days left</span>'
        elif days_rem <= 30:
            badge = f'<span style="background-color: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">{days_rem} days left</span>'
        else:
            badge = f'<span style="background-color: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">{days_rem} days left</span>'

        row_bg = "#f8fafc" if idx % 2 == 0 else "#ffffff"
        rows_html += f"""
        <tr style="background-color: {row_bg}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 8px; text-align: center; font-size: 12px; color: #64748b;">{idx}</td>
            <td style="padding: 10px 8px; font-weight: 600; color: #1e293b; font-size: 12px;">{item.get('equipment_code', '-')}</td>
            <td style="padding: 10px 8px; color: #1e293b; font-size: 12px;"><strong>{item.get('equipment_name', '-')}</strong></td>
            <td style="padding: 10px 8px; color: #475569; font-size: 12px;">{item.get('department', '-')}</td>
            <td style="padding: 10px 8px; color: #475569; font-size: 12px;">{item.get('make_model', '-')}</td>
            <td style="padding: 10px 8px; color: #475569; font-size: 12px;">{item.get('serial_number', '-')}</td>
            <td style="padding: 10px 8px; color: #1e293b; font-size: 12px; white-space: nowrap;">{due_str}</td>
            <td style="padding: 10px 8px; text-align: center; white-space: nowrap;">{badge}</td>
        </tr>
        """

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px 32px; color: #ffffff;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #93c5fd; margin-bottom: 4px;">
                    SmartCampus Maintenance Governance
                </div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                    Scheduled Calibration Notice
                </h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #dbeafe;">
                    Automated advance notification for equipment due for calibration
                </p>
            </div>

            <!-- Content Area -->
            <div style="padding: 28px 32px;">
                <p style="font-size: 14px; color: #334155; margin-top: 0; line-height: 1.5;">
                    Dear <strong>{recipient_name}</strong>,
                </p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                    This is an automated notification to inform you that <strong>{total_count} equipment item{'s require' if total_count > 1 else ' requires'} calibration</strong> in the upcoming window. Please initiate quotation requests from certified agencies and schedule maintenance to ensure compliance and avoid operational disruption.
                </p>

                <!-- Summary Box -->
                <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                    <div style="font-size: 13px; color: #1e40af; font-weight: 600;">
                        Action Required:
                    </div>
                    <div style="font-size: 12px; color: #1e3a8a; margin-top: 4px;">
                        &bull; Review equipment list below<br/>
                        &bull; Obtain quotes from authorized calibration agencies<br/>
                        &bull; Complete calibration and update records in SmartCampus
                    </div>
                </div>

                <!-- Equipment Table -->
                <div style="overflow-x: auto; margin-top: 20px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <thead>
                            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: center;">#</th>
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Asset ID</th>
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Equipment Name</th>
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Department</th>
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Make / Model</th>
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Serial No</th>
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569;">Due Date</th>
                                <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: center;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows_html}
                        </tbody>
                    </table>
                </div>

                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 13px; color: #64748b; margin: 0;">
                        Best regards,<br/>
                        <strong style="color: #1e293b;">SmartCampus Maintenance Governance Team</strong>
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
                This is an automated system email from Eastpoint Smart Campus | Powered by NissiGrid Technologies.<br/>
                Please do not reply directly to this email.
            </div>
        </div>
    </body>
    </html>
    """
    return subject, html_body


def build_pm_advance_email(
    department_name: str,
    target_month: str,
    target_year: int,
    days_remaining: int,
    recipient_name: str = "Team",
) -> tuple[str, str]:
    """
    Build subject and HTML body for Preventive Maintenance (PM) Advance Notice.
    """
    subject = f"Advance Notice: PM Scheduled for {department_name} ({target_month} {target_year})"

    day_word = f"{days_remaining} day" if days_remaining == 1 else f"{days_remaining} days"
    if days_remaining <= 7:
        time_text = f"in {day_word}"
        urgency_badge = f'<span style="background-color: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 12px;">Due in {day_word}</span>'
    elif days_remaining <= 30:
        time_text = f"in {day_word}"
        urgency_badge = f'<span style="background-color: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 12px;">Due in {day_word}</span>'
    else:
        time_text = f"approaching in {day_word}"
        urgency_badge = f'<span style="background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 12px;">{day_word} ahead</span>'

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); padding: 24px 32px; color: #ffffff;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #99f6e4; margin-bottom: 4px;">
                    SmartCampus Maintenance Governance
                </div>
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                    Preventive Maintenance Advance Notice
                </h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #ccfbf1;">
                    Department Schedule Reminder
                </p>
            </div>

            <!-- Content Area -->
            <div style="padding: 28px 32px;">
                <p style="font-size: 14px; color: #334155; margin-top: 0;">
                    Dear <strong>{recipient_name}</strong>,
                </p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6;">
                    This is an automated notification to remind you that Preventive Maintenance is scheduled for the <strong>{department_name}</strong> department in <strong>{target_month} {target_year}</strong> ({time_text}).
                </p>

                <!-- Schedule Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px 20px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 40%;">Department:</td>
                            <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">{department_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Scheduled Period:</td>
                            <td style="padding: 6px 0; color: #1e293b; font-weight: 700;">{target_month} {target_year}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Advance Notice:</td>
                            <td style="padding: 6px 0;">{urgency_badge}</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                    <div style="font-size: 13px; color: #115e59; font-weight: 600;">
                        Preparations Required:
                    </div>
                    <div style="font-size: 12px; color: #134e4a; margin-top: 4px;">
                        &bull; Notify department personnel of upcoming maintenance<br/>
                        &bull; Review spare parts and tools availability<br/>
                        &bull; Confirm biomedical / facilities engineering team readiness
                    </div>
                </div>

                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <p style="font-size: 13px; color: #64748b; margin: 0;">
                        Best regards,<br/>
                        <strong style="color: #1e293b;">SmartCampus Maintenance Governance Team</strong>
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
                This is an automated system email from Eastpoint Smart Campus | Powered by NissiGrid Technologies.<br/>
                Please do not reply directly to this email.
            </div>
        </div>
    </body>
    </html>
    """
    return subject, html_body
