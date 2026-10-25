import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from backend.app.config import settings

class EmailDeliveryResult:
    def __init__(self, success: bool, mode: str, status: str, preview_body: Optional[str] = None, error_message: Optional[str] = None):
        self.success = success
        self.mode = mode # "MOCK_DEV" or "REAL_SMTP"
        self.status = status # "PREVIEWED", "SENT", "FAILED"
        self.preview_body = preview_body
        self.error_message = error_message

def render_price_alert_email_html(
    product_title: str,
    previous_price: Optional[float],
    new_price: float,
    currency: str,
    target_price: Optional[float],
    retailer_name: str,
    listing_url: str
) -> str:
    savings = (previous_price - new_price) if previous_price and previous_price > new_price else 0.0
    savings_pct = round((savings / previous_price * 100), 1) if previous_price and previous_price > 0 else 0.0

    return f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 24px; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 24px; color: #ffffff; letter-spacing: -0.5px; }}
    .content {{ padding: 24px; }}
    .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #059669; color: #ffffff; margin-bottom: 16px; }}
    .price-box {{ background-color: #162032; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
    .current-price {{ font-size: 32px; font-weight: 700; color: #38bdf8; }}
    .old-price {{ text-decoration: line-through; color: #94a3b8; font-size: 16px; margin-left: 10px; }}
    .cta-button {{ display: inline-block; background-color: #06b6d4; color: #0b0f19; font-weight: 700; padding: 12px 28px; border-radius: 8px; text-decoration: none; margin-top: 16px; }}
    .footer {{ padding: 16px 24px; background-color: #0a0e17; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SmartCart Price Alert</h1>
    </div>
    <div class="content">
      <div class="badge">PRICE DROP DETECTED</div>
      <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #f8fafc;">{product_title}</h2>
      <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px 0;">Great news! The price at <strong>{retailer_name}</strong> just dropped to your target threshold.</p>
      
      <div class="price-box">
        <span class="current-price">{currency} {new_price:,.2f}</span>
        {f'<span class="old-price">{currency} {previous_price:,.2f}</span>' if previous_price else ''}
        {f'<div style="color: #34d399; font-size: 14px; margin-top: 8px; font-weight: 600;">You save {currency} {savings:,.2f} ({savings_pct}%)</div>' if savings > 0 else ''}
        {f'<div style="color: #cbd5e1; font-size: 13px; margin-top: 4px;">Your target was: {currency} {target_price:,.2f}</div>' if target_price else ''}
      </div>

      <div style="text-align: center;">
        <a href="{listing_url}" class="cta-button" target="_blank">View Offer on {retailer_name}</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">Sent by SmartCart Intelligence &bull; Automated E-Commerce Price Monitoring</p>
      <p style="margin: 4px 0 0 0;">This email was generated in accordance with your notification preferences.</p>
    </div>
  </div>
</body>
</html>
"""

def send_email_alert(
    recipient: str,
    subject: str,
    html_content: str
) -> EmailDeliveryResult:
    """Dispatches email according to configured EMAIL_DELIVERY_MODE."""
    mode = settings.EMAIL_DELIVERY_MODE.upper()

    if mode == "MOCK":
        # Safe development mock mode: Do not contact external SMTP server
        return EmailDeliveryResult(
            success=True,
            mode="MOCK_DEV",
            status="PREVIEWED",
            preview_body=html_content,
            error_message=None
        )

    # Real SMTP mode
    try:
        if not settings.SMTP_HOST:
            return EmailDeliveryResult(
                success=False,
                mode="REAL_SMTP",
                status="FAILED",
                preview_body=html_content,
                error_message="SMTP_HOST is not configured in environment variables."
            )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = recipient
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, [recipient], msg.as_string())

        return EmailDeliveryResult(
            success=True,
            mode="REAL_SMTP",
            status="SENT",
            preview_body=html_content,
            error_message=None
        )
    except Exception as e:
        return EmailDeliveryResult(
            success=False,
            mode="REAL_SMTP",
            status="FAILED",
            preview_body=html_content,
            error_message=f"SMTP transmission failed: {str(e)}"
        )
