"""Tienda: canjear estrellas por premios reales (los entrega un adulto)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import services, store
from ..database import get_db
from ..models import Redemption
from ..schemas import (
    PurchaseIn,
    PurchaseResultOut,
    RedemptionOut,
    StoreItemOut,
    StoreOut,
)

router = APIRouter(prefix="/store", tags=["store"])


def _items_out() -> list[StoreItemOut]:
    return [
        StoreItemOut(
            key=i.key,
            emoji=i.emoji,
            title=i.title,
            description=i.description,
            cost=i.cost,
            color=i.color,
        )
        for i in store.load_items()
    ]


@router.get("", response_model=StoreOut)
def get_store(child_id: int, db: Session = Depends(get_db)) -> StoreOut:
    earned = services.stars_earned(db, child_id)
    spent = services.stars_spent(db, child_id)
    return StoreOut(
        items=_items_out(),
        stars_earned=earned,
        stars_spent=spent,
        stars_available=max(0, earned - spent),
        redemptions=[
            RedemptionOut.model_validate(r) for r in services.list_redemptions(db, child_id)
        ],
    )


@router.post("/purchase", response_model=PurchaseResultOut)
def purchase(payload: PurchaseIn, db: Session = Depends(get_db)) -> PurchaseResultOut:
    item = store.get_item(payload.item_key)
    if item is None:
        raise HTTPException(status_code=404, detail="Ese premio no existe en la tienda")

    earned = services.stars_earned(db, payload.child_id)
    spent = services.stars_spent(db, payload.child_id)
    available = earned - spent
    if available < item.cost:
        raise HTTPException(
            status_code=400,
            detail=(f"Te faltan estrellas: necesitas {item.cost} y tienes {max(0, available)}."),
        )

    redemption = Redemption(
        child_id=payload.child_id,
        item_key=item.key,
        title=item.title,
        emoji=item.emoji,
        cost=item.cost,
    )
    db.add(redemption)
    db.commit()
    db.refresh(redemption)

    new_spent = spent + item.cost
    return PurchaseResultOut(
        redemption=RedemptionOut.model_validate(redemption),
        stars_earned=earned,
        stars_spent=new_spent,
        stars_available=max(0, earned - new_spent),
    )
