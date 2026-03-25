from app.services.backend_client import BackendClient

backend_client: BackendClient | None = None


def set_backend_client(client: BackendClient) -> None:
    global backend_client
    backend_client = client


def get_backend_client() -> BackendClient | None:
    return backend_client
