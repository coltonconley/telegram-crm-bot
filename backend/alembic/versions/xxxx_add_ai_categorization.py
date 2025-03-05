"""add_ai_categorization

Revision ID: xxxx
Revises: previous_revision
Create Date: 2023-xx-xx

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = 'xxxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('messages', sa.Column('ai_category', sa.String(), nullable=True))
    op.add_column('messages', sa.Column('ai_confidence', sa.Float(), nullable=True))
    op.add_column('messages', sa.Column('ai_reasoning', sa.Text(), nullable=True))
    op.add_column('messages', sa.Column('ai_categorized_at', sa.DateTime(timezone=True), nullable=True))

def downgrade():
    op.drop_column('messages', 'ai_categorized_at')
    op.drop_column('messages', 'ai_reasoning')
    op.drop_column('messages', 'ai_confidence')
    op.drop_column('messages', 'ai_category') 