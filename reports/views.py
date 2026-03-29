from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated 
from expenses.models import Expense

from reports.services.analytics import (
    get_category_breakdown,
    get_largest_expense,
    get_monthly_summary,
    get_monthly_total,
    get_top_category,
    get_spending_trend,
    get_budget_status,
    generate_insights,
    generate_smart_alerts,
    predict_monthly_spending,
    detect_spending_anomalies,
)

from reports.services.ai_insights import generate_ai_insights, suggest_ai_category, explain_anomalies
from reports.services.ai_parser import parse_natural_expense 

class DashboardReportView(APIView):
    permission_classes = [IsAuthenticated]
     
    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        year = int(year) if year else None
        month = int(month) if month else None
        category_data = get_category_breakdown(
            request.user,
            year,
            month
        )
        total = get_monthly_total(
            request.user,
            year,
            month
        )
        
        largest_expense = get_largest_expense(request.user)
        largest_data = None
        if largest_expense: 
            largest_data = {
                "title": largest_expense.title,
                "amount": largest_expense.amount
            }
        return Response({
            "total_spent": total,
            "category_breakdown": category_data,
            "largest_expense": largest_data,
        })

class TopCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        result = get_top_category(request.user, year, month)
        
        if not result:
            return Response({
                'category': None,
                'total':0
            })
        return Response({
            'category': result['category'],
            'total': result['total']
        })
        
class MonthlySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        data = get_monthly_summary(request.user, year, month)
        return Response(data)
    
    
class SpendingTrendView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year')
        
        data = get_spending_trend(request.user, year)
        return Response(data)
    
    
class BudgetStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = int(request.query_params.get('year'))
        month = int(request.query_params.get('month'))
        
        data = get_budget_status(request.user, year, month)
        
        return Response(data)
    
    
class InsightsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        insights = generate_insights(request.user, year, month)
        
        return Response({
            'insights':insights
        })
        
class AIInsightsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        raw_insights = generate_insights(request.user, year, month)
        
        ai_response = generate_ai_insights(raw_insights)
        
        return Response({
            'raw_insights': raw_insights,
            'ai_advice': ai_response, 
        })
        
class SmartInsightsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        raw_insights = generate_insights(request.user, year, month)
        alerts = generate_smart_alerts(request.user, year, month)
        prediction = predict_monthly_spending(request.user, year, month)
        
        ai_advice = generate_ai_insights(raw_insights + alerts)
        
        return Response({
            "prediction": prediction,
            "alerts": alerts,
            "insights": raw_insights,
            "ai_advice": ai_advice,
        })
        

class SuggestCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        title = request.data.get('title')
        
        if not title: 
            return Response({'error': "Title is requried"}, status=400)
        
        category = suggest_ai_category(title)
        return Response({
            "title": title,
            "suggested_category": category,
        })
        
class SmartAnomalyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get('year'))
        month = int(request.query_params.get('month'))

        anomalies = detect_spending_anomalies(request.user, year, month)

        explanation = explain_anomalies(anomalies)

        return Response({
            "anomalies": anomalies,
            "ai_explanation": explanation 
        }) 
        
        
class NaturalExpenseParserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        text = request.data.get('text')
        
        if not text: 
            return Response({'error'})
        result = parse_natural_expense(text)
        return Response(result)