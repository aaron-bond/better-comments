DROP TABLE IF EXISTS docs;

-- ! this is a comment
CREATE TABLE docs (line STRING);

-- * some highlighted comment
LOAD DATA INPATH 'input_file' OVERWRITE INTO TABLE docs;

-- TODO: create schema
CREATE TABLE word_counts AS

SELECT word, count(1) AS count FROM

 (SELECT explode(split(line, '\s')) AS word FROM docs) temp

GROUP BY word

ORDER BY word;