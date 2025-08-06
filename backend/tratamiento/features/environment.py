import os
import django
from django.core.management import execute_from_command_line
from django.test.utils import setup_test_environment, teardown_test_environment

def before_all(context):
    """Configuración antes de todas las pruebas"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'migraine_app.settings')
    django.setup()
    setup_test_environment()

def after_all(context):
    """Limpieza después de todas las pruebas"""
    teardown_test_environment()

def before_scenario(context, scenario):
    """Configuración antes de cada escenario"""
    # Limpiar base de datos antes de cada escenario
    from django.core.management import call_command
    call_command('flush', interactive=False, verbosity=0)

def after_scenario(context, scenario):
    """Limpieza después de cada escenario"""
    pass
