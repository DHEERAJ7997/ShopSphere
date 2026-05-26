from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.manage_cart, name='manage_cart'),
    path('checkout/', views.checkout, name='checkout'),
]
