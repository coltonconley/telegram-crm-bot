from datetime import datetime
from app.services.ai_categorization import ai_categorization

# Inside the create method of MessageCRUD class:
async def create(self, db: Session, *, obj_in: MessageCreate, user_id: int) -> Message:
    # Create message object as before
    db_obj = Message(
        # existing fields...
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Now perform AI categorization asynchronously
    try:
        categorization = await ai_categorization.categorize_message(db_obj.message_text)
        
        # Update the message with AI categorization
        db_obj.ai_category = categorization["category"]
        db_obj.ai_confidence = categorization["confidence"]
        db_obj.ai_reasoning = categorization["reasoning"]
        db_obj.ai_categorized_at = datetime.now()
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
    except Exception as e:
        # Log error but don't fail message creation
        logger.error(f"Error during AI categorization: {str(e)}")
    
    return db_obj 