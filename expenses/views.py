from .models import Expense, Budget
from django.db.models import Sum 
from rest_framework import generics 
from rest_framework.views import APIView
from .serializers import ExpenseSerializer, BudgetSerializer
from rest_framework.response import Response 
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.viewsets import ModelViewSet

from reports.services.analytics import get_category_breakdown
  
class MonthlyTotalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        queryset = Expense.objects.filter(
            owner = request.user, 
            date__year = year,
            date__month = month, 
        )
        
        total = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        
        
        return Response({
            "year": year,
            "month": month,
            "total": total
        })

class CategoryBreakdownView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        self.permission_classes = [IsAuthenticated]
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        breakdown = get_category_breakdown(
            request.user,
            year,
            month
        )
        return Response(breakdown)
       
class ExpenseViewSet(ModelViewSet):
    serializer_class = ExpenseSerializer 
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ['title', 'category']
    ordering_fields = ['amount', 'date']
    ordering = ['-date']
    
    filterset_fields = {
        'category': ['exact'],
        'date': ['gte', 'lte'],
    }
    
    def get_queryset(self):
        return Expense.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class BudgetViewSet(ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
 
    def get_queryset(self):
        qs = Budget.objects.filter(owner=self.request.user).order_by('-year', '-month', 'category')  # ✅ fixes UnorderedObjectListWarning
 
        # filter by month/year if provided — so frontend gets only relevant budgets
        year  = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        if year:  qs = qs.filter(year=int(year))
        if month: qs = qs.filter(month=int(month))
 
        return qs
 
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)