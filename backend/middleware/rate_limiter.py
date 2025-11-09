"""Middleware de rate limiting"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Créer le limiter
limiter = Limiter(key_func=get_remote_address)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Handler personnalisé pour rate limit dépassé"""
    logger.warning(f"Rate limit exceeded for {get_remote_address(request)}")
    raise HTTPException(
        status_code=429,
        detail="Trop de requêtes. Veuillez réessayer plus tard."
    )

# Décorateurs de rate limiting courants
def strict_rate_limit():
    """Rate limit strict pour endpoints sensibles"""
    return limiter.limit("5/minute")

def normal_rate_limit():
    """Rate limit normal"""
    return limiter.limit("60/minute")

def relaxed_rate_limit():
    """Rate limit relaxé"""
    return limiter.limit("100/minute")
