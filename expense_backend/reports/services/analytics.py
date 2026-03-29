from django.db.models import Sum, Count, Max
from expenses.models import Expense, Budget
from django.utils.timezone import now
from django.db.models.functions import ExtractMonth
from decimal import Decimal
import calendar
from decimal import Decimal
def get_category_breakdown(user, year=None, month=None):
    today = now()
    
    year = int(year) if year else today.year
    month = int(month) if month else today.month
    queryset = Expense.objects.filter(
        owner = user,
        date__year = year,
        date__month = month,
    ) 
    return (
        queryset
        .values('category')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    


def get_monthly_total(user,year=None,month=None):
    today = now()
    
    year = int(year) if year else today.year
    month = int(month) if month else today.month
    
    queryset = Expense.objects.filter(
        owner = user,
        date__year = year,
        date__month = month,
    )    
    
    total = queryset.aggregate(total = Sum('amount'))['total'] or 0
    return total

def get_largest_expense(user):
    return (
        Expense.objects
        .filter(owner=user)
        .order_by('-amount')
        .first()
    )
    
def get_top_category(user, year = None, month = None):
    today = now()
    year = int(year) if year else today.year
    month = int(month) if month else today.month
    
    queryset = (Expense.objects.filter(
        owner = user,
        date__year = year,
        date__month = month,
    )
    .values('category')
    .annotate(total=Sum('amount'))
    .order_by('-total')  
    )
    
    return queryset.first()

def get_largest_monthly_expense(user, year=None, month=None):
    res = (
        Expense.objects.filter(
            owner = user,
            date__year = year, 
            date__month = month,
        )
        .aggregate(max_spent=Max('amount'))
    )
    return res['max_spent'] 
def get_monthly_summary(user, year=None, month=None):
    today = now()
    
    year = int(year) if year else today.year
    month = int(month) if year else today.month
    
    queryset = (
        Expense.objects.filter(
            owner = user,
            date__year = year,
            date__month = month,
        )
        .values('category')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    
    total = queryset.aggregate(total=Sum('amount'))['total'] or 0 
    transactions = queryset.aggregate(count=Count('id'))['count']
    
    category_breakdown = (queryset.values('category').annotate(total=Sum('amount')).order_by('-total'))

    largest_expense = get_largest_monthly_expense(user,year,month) or 0
    
    return {
        "year": year,
        "month": month, 
        "total": total, 
        "transactions": transactions,
        "largest_expense": largest_expense,
        "category_breakdown": category_breakdown
    }
    


def get_spending_trend(user,year=None):
    today = now()
    year = int(year) if year else today.year

    queryset = ( Expense.objects.filter(owner=user, date__year = year)
                .annotate(month=ExtractMonth('date'))
                .values('month')
                .annotate(total=Sum('amount'))
                .order_by('month') 
                )
    
    data = {item['month']: item['total'] for item in queryset}
    result = []
    for month in range(1,13):
        result.append({
            "month": month,
            "total":data.get(month,0)
        })
    return result


def get_budget_status(user, year, month):
    budgets = Budget.objects.filter(owner=user,year=year,month=month)
    result = []
    
    for budget in budgets: 
        spent = (
            Expense.objects
            .filter(
                owner=user,
                category=budget.category, 
                date__year = year, 
                date__month = month 
            )
            .aggregate(Sum('amount'))['amount__sum'] or 0
        )
        
        status = "OK"
        if spent > budget.limit: 
            status = "OVERSPENT"
        elif spent > (Decimal('0.8') * budget.limit):
            status = "WARNING"
    
        result.append({
            'category':budget.category,
            'limit':budget.limit, 
            'spent':spent,
            'status': status
        })

    return result


def generate_insights(user, year=None, month=None):
    today = now()

    year = int(year) if year else today.year 
    month = int(month) if month else today.month 
    
    insights = []
    
    current_total = (
        Expense.objects
        .filter(owner=user, date__year=year, date__month=month)
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    
    # previous month logic 
    prev_month = month - 1 if month > 1 else 12 
    prev_year = year if month > 1 else year - 1 
    
    previous_total = (
        Expense.objects 
        .filter(owner=user, date__year = prev_year,date__month=prev_month)
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    
    if previous_total>0:
        change = ((current_total - previous_total)/ previous_total) * 100 
        
        if change > 0:
            insights.append(f"You spent {round(change,1)}% more than last month")
            
        elif change < 0:
            insights.append(f"Good job! You spent {abs(round(change,1))}% less than the last month")
    
    top_category = (
        Expense.objects
        .filter(owner=user, date__year=year, date__month=month)
        .values('category')
        .annotate(total=Sum('amount'))
        .order_by('-total')
        .first()
    )
    
    if top_category:
        insights.append(f"{top_category['category']} is your highest spending category")
    
    budgets = Budget.objects.filter(owner=user, year=year, month=month)
    
    for budget in budgets:
        spent = (
            Expense.objects
            .filter(
                owner=user,
                category=budget.category,
                date__year = year, 
                date__month=month
            )
            .aggregate(Sum('amount'))['amount__sum'] or 0
        )
        
        if spent > budget.limit:
            insights.append(f"You have overspent in {budget.category}")
        elif spent > (Decimal('0.8') * budget.limit):
            insights.append(f"You are close to overspending in {budget.category}")

    return insights

def predict_monthly_spending(user, year=None, month=None):
    today=now()
    
    year = int(year) if year else today.year
    month = int(month) if year else today.month
    current_day = today.day
    total_days = calendar.monthrange(year, month)[1]
    
    total_spent = (
        Expense.objects 
        .filter(owner=user, date__year=year,date__month=month)
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    
    if current_day == 0:
        return 0
    
    daily_avg = total_spent / current_day 
    predicted_total = daily_avg * total_days 
    
    return round(predicted_total,2)


def generate_smart_alerts(user, year=None, month=None):
    today = now()

    year = int(year) if year else today.year
    month = int(month) if year else today.month
    alerts = []
    current_total = (
        Expense.objects
        .filter(owner=user, date__year=year,date__month=month)
        .aggregate(total=Sum('amount'))['total'] or 0
    )
    
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1

    previous_total = (
        Expense.objects
        .filter(owner=user, date__year=prev_year, date__month=prev_month)
        .aggregate(total=Sum('amount'))['total'] or 0
    )

    if previous_total > 0: 
        change = ((current_total - previous_total) / previous_total) * 100
        
        if change > 50: 
            alerts.append('Your spending increased drastically this month!')
        
    max_expense = (
        Expense.objects
        .filter(owner=user, date__year=year, date__month=month)
        .order_by('-amount')
        .first()
    )
    if max_expense and max_expense.amount> Decimal('0.3') * current_total: 
        alerts.append(f"High expense detected: {max_expense.title}")
        
    return alerts

# def detect_spending_anomalies(user,year,month):
#     current_qs = Expense.objects.filter(
#         owner = user,
#         date__year = year,
#         date__month = month,
#     )
    
#     anomalies = []
    
#     categories = current_qs.values_list('category', flat=True).distinct()
    
#     for category in categories:
#         current_total = (
#             current_qs
#             .filter(category=category)
#             .aggregate(Sum('amount'))['amount__sum'] or 0
#         )
        
#         prev_totals = []
        
#         for i in range(1,4):
#             prev_month = month - 1
#             prev_year = year 
#             if prev_month <=0:
#                 prev_month += 12 
#                 prev_year -= 1
                
#             prev_total = (
#                 Expense.objects.filter(
#                     owner=user,
#                     category=category,
#                     date__year=prev_year,
#                     date__month=prev_month
#                 ).aggregate(Sum('amount'))['amount__sum'] or 0
#             )
#             prev_totals.append(prev_total)

#             avg_prev = sum(prev_totals) / 3 if prev_totals else 0 
#             print(type(avg_prev))
#             if avg_prev > 0 and current_total > Decimal(1.3) * Decimal(avg_prev):
                
#                 top_expenses = list(
#                     current_qs 
#                     .filter(category=category)
#                     .order_by('-amount')[:3]

#                 )
#                 anomalies.append({
#                     "category":category,
#                     "current_total": float(current_total),
#                     "average": float(avg_prev),
#                     "increase_pct":round(((current_total - avg_prev)/ avg_prev)* 100,2),
#                     "top_expenses": top_expenses
#                 })
#     return anomalies


def detect_spending_anomalies(user, year, month):
    year  = int(year)
    month = int(month)

    current_qs = Expense.objects.filter(
        owner=user,
        date__year=year,
        date__month=month,
    )

    anomalies = []
    categories = current_qs.values_list('category', flat=True).distinct()

    for category in categories:
        current_total = (
            current_qs
            .filter(category=category)
            .aggregate(Sum('amount'))['amount__sum'] or 0
        )

        prev_totals = []

        for i in range(1, 4):
            prev_month = month - i          # ✅ was always month - 1
            prev_year  = year
            if prev_month <= 0:
                prev_month += 12
                prev_year  -= 1

            prev_total = (
                Expense.objects.filter(
                    owner=user,
                    category=category,
                    date__year=prev_year,
                    date__month=prev_month,
                ).aggregate(Sum('amount'))['amount__sum'] or 0
            )
            prev_totals.append(prev_total)

        # ✅ divide by actual number of months fetched, not hardcoded 3
        avg_prev = sum(prev_totals) / len(prev_totals) if prev_totals else 0

        if avg_prev > 0 and Decimal(str(current_total)) > Decimal('1.3') * Decimal(str(avg_prev)):

            # ✅ serialize to dict — Expense objects are not JSON serializable
            top_expenses = list(
                current_qs
                .filter(category=category)
                .order_by('-amount')
                .values('id', 'title', 'amount', 'date', 'category')  # ← dicts not objects
                [:3]
            )

            anomalies.append({
                "category":     category,
                "current_total": float(current_total),
                "average":       float(avg_prev),
                "increase_pct":  round(
                    ((float(current_total) - float(avg_prev)) / float(avg_prev)) * 100, 2
                ),
                "top_expenses": top_expenses,   # ← now a list of dicts ✅
            })

    return anomalies