"""Add sales and booking modules.

Adds to businesses: slot_duration, min_booking_duration, max_booking_duration
Adds to appointments: customer_name, phone, duration, created_at
New tables: products, sales, working_hours, business_breaks
"""
from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade():
    # ── businesses: booking config ────────────────────────────────────────────
    op.add_column('businesses', sa.Column('slot_duration', sa.Integer(), nullable=True, server_default='30'))
    op.add_column('businesses', sa.Column('min_booking_duration', sa.Integer(), nullable=True, server_default='30'))
    op.add_column('businesses', sa.Column('max_booking_duration', sa.Integer(), nullable=True, server_default='120'))

    # ── appointments: customer info + duration ────────────────────────────────
    op.add_column('appointments', sa.Column('customer_name', sa.String(), nullable=True))
    op.add_column('appointments', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('appointments', sa.Column('duration', sa.Integer(), nullable=True, server_default='30'))
    op.add_column('appointments', sa.Column('created_at', sa.DateTime(), nullable=True))

    # ── products ──────────────────────────────────────────────────────────────
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('business_id', sa.Integer(), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('price', sa.Float(), nullable=True, server_default='0'),
        sa.Column('quantity', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('discount', sa.Float(), nullable=True, server_default='0'),
        sa.Column('active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # ── sales ─────────────────────────────────────────────────────────────────
    op.create_table(
        'sales',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('business_id', sa.Integer(), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('customer_name', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('product_id', sa.Integer(), sa.ForeignKey('products.id', ondelete='SET NULL'), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('discount', sa.Float(), nullable=True, server_default='0'),
        sa.Column('final_price', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )

    # ── working_hours (one row per business) ──────────────────────────────────
    op.create_table(
        'working_hours',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('business_id', sa.Integer(), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('start_time', sa.String(5), nullable=False, server_default='09:00'),
        sa.Column('end_time', sa.String(5), nullable=False, server_default='18:00'),
    )

    # ── business_breaks ───────────────────────────────────────────────────────
    op.create_table(
        'business_breaks',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('business_id', sa.Integer(), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_time', sa.String(5), nullable=False),
        sa.Column('end_time', sa.String(5), nullable=False),
        sa.Column('label', sa.String(), nullable=True),
    )


def downgrade():
    op.drop_table('business_breaks')
    op.drop_table('working_hours')
    op.drop_table('sales')
    op.drop_table('products')
    op.drop_column('appointments', 'created_at')
    op.drop_column('appointments', 'duration')
    op.drop_column('appointments', 'phone')
    op.drop_column('appointments', 'customer_name')
    op.drop_column('businesses', 'max_booking_duration')
    op.drop_column('businesses', 'min_booking_duration')
    op.drop_column('businesses', 'slot_duration')
