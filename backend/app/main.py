from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import snippets_router, collections_router, shares_router, search_router, meta_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SnippetHub API",
    description="Code snippet management API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(snippets_router)
app.include_router(collections_router)
app.include_router(shares_router)
app.include_router(search_router)
app.include_router(meta_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "SnippetHub API is running"}


@app.get("/")
async def root():
    return {
        "name": "SnippetHub API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "/api/snippets",
            "/api/collections",
            "/api/shares",
            "/api/search",
            "/api/languages",
            "/api/tags"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
