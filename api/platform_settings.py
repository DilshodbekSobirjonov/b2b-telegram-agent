from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.repository import Repository
from database.admin_users import AdminUser
from database.models import PlatformSetting
from api.auth import require_super_admin
from pydantic import BaseModel

router = APIRouter(prefix="/api/platform-settings", tags=["platform-settings"])


class PlatformSettingUpdate(BaseModel):
    global_ai_rules: str


@router.get("")
def get_platform_settings(
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    setting = db.query(PlatformSetting).filter(PlatformSetting.key == "global_ai_rules").first()
    return {
        "global_ai_rules": setting.value if setting else ""
    }


@router.patch("")
def update_platform_settings(
    body: PlatformSettingUpdate,
    db: Session = Depends(Repository.get_db),
    current_user: AdminUser = Depends(require_super_admin),
):
    setting = db.query(PlatformSetting).filter(PlatformSetting.key == "global_ai_rules").first()
    if not setting:
        setting = PlatformSetting(key="global_ai_rules", value=body.global_ai_rules)
        db.add(setting)
    else:
        setting.value = body.global_ai_rules

    db.commit()
    db.refresh(setting)
    return {"message": "Platform settings updated", "global_ai_rules": setting.value}
