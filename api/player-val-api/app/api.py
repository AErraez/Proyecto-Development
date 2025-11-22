import json
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from loguru import logger

from player_value_model import PlayerValueModel, __version__ as model_version
from app import schemas, __version__

api_router = APIRouter()

model = PlayerValueModel()


@api_router.get("/health")
def health():
    return {"status": "ok"}


@api_router.get("/version")
def version():
    return {
        "api_version": __version__,
        "model_version": model_version,
    }


@api_router.post("/predict", response_model=schemas.PredictionResults)
def predict(input_data: schemas.MultiplePlayerInput):

    records = [item.dict(by_alias=True) for item in input_data.inputs]
    df = pd.DataFrame(records)

    try:
        preds = model.predict(df)
        return {
            "predictions": preds,
            "errors": None,
            "version": model_version,
        }

    except Exception as e:
        logger.error(str(e))
        return {
            "predictions": None,
            "errors": str(e),
            "version": model_version,
        }
