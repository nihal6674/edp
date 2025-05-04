from mongoengine import Document, StringField

class Item(Document):
    id = StringField(required=True, unique=True)
    rfid_id = StringField(required=True, unique=True)
    name = StringField(required=True)
    code= StringField() #  critical noncritical
    type = StringField()   # 1 2 for weight and tag categorization
    

    # Optional: Add a string representation for easy debugging
    def __str__(self):
        return f"Item(tag_uid={self.tag_uid}, item_name={self.item_name}, item_type={self.item_type}, category={self.category})"
