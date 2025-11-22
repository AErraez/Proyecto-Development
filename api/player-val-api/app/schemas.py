from typing import List, Optional
from pydantic import BaseModel, Field


class PlayerFeatures(BaseModel):
    market_value_in_eur: float
    Squad: str
    KP: float
    Carries: float
    G_plus_A: float = Field(..., alias="G+A")
    Touches: float
    Comp_eng_Premier_League: bool = Field(..., alias="Comp_eng Premier League")
    Age: float
    npxG: float
    MP: float
    Ast: float
    xG: float
    Starts: float
    PrgC: float
    Nation: str
    Dis: float
    Min: float
    G_minus_PK: float = Field(..., alias="G-PK")
    Nineties: float = Field(..., alias="90s")
    Gls: float
    Tkl_plus_Int: float = Field(..., alias="Tkl+Int")
    xAG: float
    TklW: float
    PrgP: float
    Recov: float
    PKwon: float
    Cmp_pct: float = Field(..., alias="Cmp%")
    Int: float
    CrdR: float
    PPA: float
    Comp_fr_Ligue1: bool = Field(..., alias="Comp_fr Ligue 1")
    CS_pct: float = Field(..., alias="CS%")
    Pos_GK: bool
    GA: float
    Comp_it_SerieA: bool = Field(..., alias="Comp_it Serie A")
    PrgR: float

    class Config:
        allow_population_by_field_name = True


class MultiplePlayerInput(BaseModel):
    inputs: List[PlayerFeatures]


class PredictionResults(BaseModel):
    errors: Optional[str]
    version: str
    predictions: Optional[list]
