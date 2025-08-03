# Gunicorn config file
# https://docs.gunicorn.org/en/stable/settings.html

# The maximum size of HTTP request line in bytes.
# This parameter is used to limit the size of the HTTP request line that Gunicorn will
# process. This is to prevent vulnerability to buffer overflow attacks.
# The default value is 4094. We increase it to handle potentially large Data URIs
# in form submissions. 16KB should be more than enough.
limit_request_line = 16384
