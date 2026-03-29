from django.urls import path, include 
 
urlpatterns = [
    path('', include('expenses.urls')),
    path('users/', include('users.urls')),
    path('reports/', include('reports.urls'))
]