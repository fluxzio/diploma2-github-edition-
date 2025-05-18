from django.core.mail import send_mail
from celery import shared_task


@shared_task
def send_email_task(subject, message, from_email, recipient_list):
    """
    A Celery task to send an email asynchronously.
    """
    try:
        send_mail(subject, message, from_email, recipient_list)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

