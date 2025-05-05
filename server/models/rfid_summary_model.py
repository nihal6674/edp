from mongoengine import Document, StringField, IntField, DateTimeField

class RFIDSummaryModel(Document):
    quantity = IntField(required=True)
    mode = StringField(required=True)
    item_name = StringField(required=True)
    timestamp = DateTimeField(required=True, default=datetime.utcnow)
    ambulance_id = StringField(required=True)

    meta = {
        'collection': 'rfid_summary',
        'indexes': [
            'ambulance_id', 'timestamp'
        ]
    }
