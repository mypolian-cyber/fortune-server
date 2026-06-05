from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine, Base

load_dotenv()

app = FastAPI(title="Fortune API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fortune.adelante-properties.com",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok"}

from app.routers import saju, payment, yukim, goonghap, contact, admin
app.include_router(saju.router, prefix="/api/saju", tags=["saju"])
app.include_router(payment.router, prefix="/api/payment", tags=["payment"])
app.include_router(yukim.router, prefix="/api/yukim", tags=["yukim"])
app.include_router(goonghap.router, prefix="/api/goonghap", tags=["goonghap"])
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

from fastapi import UploadFile, File
import shutil

@app.post("/api/admin/upload-image")
async def upload_image(file: UploadFile = File(...)):
    save_path = f"/root/fortune-server/frontend/public/{file.filename}"
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    # 빌드 트리거
    import subprocess
    subprocess.Popen(
        ["/usr/bin/npm", "run", "build"],
        cwd="/root/fortune-server/frontend"
    )
    return {"success": True, "path": f"/{file.filename}"}
