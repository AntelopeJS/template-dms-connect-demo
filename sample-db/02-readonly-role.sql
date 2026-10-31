CREATE ROLE dms_reader LOGIN PASSWORD 'dms_reader';
GRANT CONNECT ON DATABASE chinook TO dms_reader;
GRANT USAGE ON SCHEMA public TO dms_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dms_reader;
