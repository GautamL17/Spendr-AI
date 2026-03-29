from django.db import models
from django.conf import settings 

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('FOOD', 'Food'),
        ('TRAVEL', 'Travel'),
        ('SHOPPING', 'Shopping'),
        ('TRANSPORT','transport'),
        ('ENTERTAINMENT','entertainment'),
        ('HEALTH','health'),
        ('BILLS', 'Bills'),
        ('OTHER', 'Other'),
    ]
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    date = models.DateField()
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.amount}"
    
class Budget(models.Model):
    CATEGORY_CHOICES = Expense.CATEGORY_CHOICES

    category = models.CharField(max_length=20, choices = CATEGORY_CHOICES)
    limit = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.IntegerField()
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    
    class Meta: 
        unique_together=('owner','category', 'month', 'year')
    
    def __str__(self):
        return f"{self.owner} - {self.category} - {self.limit}"