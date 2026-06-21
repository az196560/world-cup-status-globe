from __future__ import annotations

import os
import smtplib
from email.message import EmailMessage

from .config import EmailConfig
from .programs import PROGRAMS


class Emailer:
    def __init__(self, config: EmailConfig):
        self.config = config

    def send_new_awards(self, awards: list[dict]) -> None:
        if not self.config.enabled or not awards:
            return
        host = os.getenv("SMTP_HOST")
        port = int(os.getenv("SMTP_PORT", "587"))
        username = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        if not host:
            raise RuntimeError("SMTP_HOST is required when email alerts are enabled")

        message = EmailMessage()
        message["Subject"] = f"{len(awards)} new award ticket result(s)"
        message["From"] = self.config.sender
        message["To"] = ", ".join(self.config.recipients)
        message.set_content(self._render_text(awards))

        with smtplib.SMTP(host, port, timeout=30) as smtp:
            smtp.starttls()
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)

    def _render_text(self, awards: list[dict]) -> str:
        lines = ["New award ticket availability:", ""]
        for item in awards:
            program = PROGRAMS.get(item["program"], item["program"])
            taxes = ""
            if item.get("taxes_cents") is not None:
                taxes = f" + ${item['taxes_cents'] / 100:.2f}"
            lines.append(
                f"- {program}: {item['origin']}-{item['destination']} "
                f"{item['departure_date']} {item['cabin']} "
                f"{item['seats']} seat(s), {item.get('points') or '?'} points{taxes}"
            )
        return "\n".join(lines)

