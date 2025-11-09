"""Service d'audit et de logging sécurisé"""
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import json

logger = logging.getLogger(__name__)

class AuditService:
    def __init__(self, db):
        self.db = db
    
    async def log_action(self, 
                        user_id: str, 
                        action: str, 
                        resource_type: str,
                        resource_id: Optional[str] = None,
                        details: Optional[Dict[str, Any]] = None,
                        ip_address: Optional[str] = None,
                        user_agent: Optional[str] = None):
        """Enregistre une action d'audit"""
        audit_log = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        
        try:
            await self.db.audit_logs.insert_one(audit_log)
            logger.info(f"Audit: {user_id} - {action} - {resource_type}")
        except Exception as e:
            logger.error(f"Failed to write audit log: {str(e)}")
    
    async def get_user_activity(self, user_id: str, limit: int = 100):
        """Récupère l'activité d'un utilisateur"""
        logs = await self.db.audit_logs.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        return logs
    
    async def get_recent_activity(self, limit: int = 100):
        """Récupère l'activité récente de la plateforme"""
        logs = await self.db.audit_logs.find(
            {},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        return logs
    
    async def search_logs(self, 
                         action: Optional[str] = None,
                         resource_type: Optional[str] = None,
                         start_date: Optional[str] = None,
                         end_date: Optional[str] = None,
                         limit: int = 100):
        """Recherche dans les logs d'audit"""
        query = {}
        
        if action:
            query["action"] = action
        if resource_type:
            query["resource_type"] = resource_type
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        logs = await self.db.audit_logs.find(
            query,
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        return logs
