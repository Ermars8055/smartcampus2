import contextvars

current_user_id = contextvars.ContextVar("current_user_id", default=None)
current_tenant_id = contextvars.ContextVar("current_tenant_id", default=None)
current_site_id = contextvars.ContextVar("current_site_id", default=None)
