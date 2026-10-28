input_lines = LOAD '/tmp/my-copy-of-all-pages-on-internet' AS (line:chararray);
 
 -- * Extract words from each line and put them into a pig bag
 -- ? datatype, then flatten the bag to get one word on each row
 words = FOREACH input_lines GENERATE FLATTEN(TOKENIZE(line)) AS word;
 
 -- TODO: filter out any words that are just white spaces
 filtered_words = FILTER words BY word MATCHES '\\w+';
 
 -- ! create a group for each word
 word_groups = GROUP filtered_words BY word;
 
 -- count the entries in each group
 word_count = FOREACH word_groups GENERATE COUNT(filtered_words) AS count, group AS word;
 
 -- order the records by count
 ordered_word_count = ORDER word_count BY count DESC;
 STORE ordered_word_count INTO '/tmp/number-of-words-on-internet';