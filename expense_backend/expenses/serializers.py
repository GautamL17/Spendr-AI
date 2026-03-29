from rest_framework import serializers 
from .models import Expense, Budget
from datetime import date

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense 
        fields = '__all__'
        read_only_fields = ['id', 'owner', 'created_at']
        
        def validate_amount(self, value):
            if value <= 0:
                raise serializers.ValidationError('Amount must be greater than zero.')
            return value
        
        def validate_date(self, value):
            if value > date.today():
                raise serializers.ValidationError('Date cannot be in the future.')
            return value
        def validate_title(self, value):
            if len(value.strip()) == 0:
                raise serializers.ValidationError('Title cannot be empty.')
            return value
        
class BudgetSerializer(serializers.ModelSerializer):
    class Meta: 
        model = Budget
        fields = '__all__'
        read_only_fields = ['owner', 'created_at']