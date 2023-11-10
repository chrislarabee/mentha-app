from fastapi import FastAPI


app = FastAPI(title="Mentha App API")


@app.get("/")
def read_root():
    return {"Hello": "World"}
