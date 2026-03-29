from django.urls import path 
from .views import DashboardReportView, TopCategoryView, MonthlySummaryView, SpendingTrendView, BudgetStatusView, InsightsView, AIInsightsView, SmartInsightsView, SuggestCategoryView, SmartAnomalyView,NaturalExpenseParserView

urlpatterns = [
    path('dashboard/', DashboardReportView.as_view(), name='dashboard-report'),
    path('top-category/', TopCategoryView.as_view(), name='top-category'),
    path('monthly-summary/', MonthlySummaryView.as_view(), name='monthly-summary'),
    path('spending-trend/', SpendingTrendView.as_view(), name='spending-trend'),
    path('budget-status/', BudgetStatusView.as_view(), name='budget-status'),
    path('insights/', InsightsView.as_view(), name='insights'),
    path('ai-insights/', AIInsightsView.as_view(), name='ai-insights'),
    path('smart-insights/', SmartInsightsView.as_view(), name='smart-insights'),
    path('suggest-category/', SuggestCategoryView.as_view(), name='suggest-category'),
    path('anomaly-insights/', SmartAnomalyView.as_view(), name='anomaly-insights'),
    path('parse-natural/', NaturalExpenseParserView.as_view(), name='parse-natural'),
]


