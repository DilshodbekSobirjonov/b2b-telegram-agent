"""Refactor AI providers to global registry; businesses reference by FK

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-14 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── ai_providers: add 'provider' + 'model', drop 'base_url' + 'model_name' ──
    op.add_column('ai_providers', sa.Column('provider', sa.String(), nullable=True))
    op.add_column('ai_providers', sa.Column('model', sa.String(), nullable=True))
    op.drop_column('ai_providers', 'model_name')
    op.drop_column('ai_providers', 'base_url')

    # ── businesses: add ai_provider_id FK, drop per-business AI credential columns ──
    op.add_column('businesses', sa.Column('ai_provider_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_businesses_ai_provider_id',
        'businesses', 'ai_providers',
        ['ai_provider_id'], ['id'],
        ondelete='SET NULL',
    )
    op.drop_column('businesses', 'ai_provider')
    op.drop_column('businesses', 'ai_api_key')
    op.drop_column('businesses', 'ai_model')


def downgrade() -> None:
    # ── businesses: restore per-business AI columns ──
    op.drop_constraint('fk_businesses_ai_provider_id', 'businesses', type_='foreignkey')
    op.drop_column('businesses', 'ai_provider_id')
    op.add_column('businesses', sa.Column('ai_model', sa.String(), nullable=True))
    op.add_column('businesses', sa.Column('ai_api_key', sa.String(), nullable=True))
    op.add_column('businesses', sa.Column('ai_provider', sa.String(), nullable=True))

    # ── ai_providers: restore old columns ──
    op.add_column('ai_providers', sa.Column('base_url', sa.String(), nullable=True))
    op.add_column('ai_providers', sa.Column('model_name', sa.String(), nullable=True))
    op.drop_column('ai_providers', 'model')
    op.drop_column('ai_providers', 'provider')
