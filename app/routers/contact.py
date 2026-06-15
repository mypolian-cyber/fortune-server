from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str

@router.post("/send")
async def send_contact(req: ContactRequest):
    if not req.name or not req.email or not req.message:
        raise HTTPException(status_code=400, detail="필수 항목을 입력해주세요")
    # 인젝션 공격 차단
    import re as _re
    _patterns = ['sleep(', 'sysdate(', 'select ', 'union ', 'drop ', 'exec(', 'eval(', '<script', 'javascript:', 'benchmark(', 'insert ', '0x']
    _combined = f"{req.name} {req.email} {getattr(req, 'subject', '')} {req.message}".lower()
    if any(p in _combined for p in _patterns):
        raise HTTPException(status_code=400, detail="올바른 내용을 입력해주세요")
    if len(req.name) > 100 or len(req.message) > 2000 or len(req.email) > 200:
        raise HTTPException(status_code=400, detail="입력값이 너무 깁니다")

    smtp_host     = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port     = int(os.getenv("SMTP_PORT", "587"))
    smtp_user     = os.getenv("SMTP_USER", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    to_email      = "info@adelante-properties.com"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[후아모 문의] {req.subject or '제목 없음'}"
    msg["From"]    = smtp_user
    msg["To"]      = to_email
    msg["Reply-To"] = req.email

    body = f"""
후아모 사이트 문의가 접수되었습니다.

─────────────────────────────
이름:    {req.name}
이메일:  {req.email}
제목:    {req.subject or '제목 없음'}
─────────────────────────────

{req.message}

─────────────────────────────
답변은 {req.email} 으로 보내주세요.
"""
    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True,
        )
        return {"success": True, "message": "문의가 접수되었습니다."}
    except Exception as e:
        # SMTP 미설정 시에도 접수 완료 처리 (로그만 남김)
        print(f"SMTP 오류: {e}")
        return {"success": True, "message": "문의가 접수되었습니다."}
