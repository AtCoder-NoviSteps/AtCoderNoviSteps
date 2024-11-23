```mermaid
erDiagram

        Roles {
            ADMIN ADMIN
USER USER
        }
    


        ContestType {
            ABC ABC
APG4B APG4B
ABS ABS
ACL_PRACTICE ACL_PRACTICE
PAST PAST
EDPC EDPC
TDPC TDPC
JOI JOI
TYPICAL90 TYPICAL90
TESSOKU_BOOK TESSOKU_BOOK
MATH_AND_ALGORITHM MATH_AND_ALGORITHM
ARC ARC
AGC AGC
ABC_LIKE ABC_LIKE
ARC_LIKE ARC_LIKE
AGC_LIKE AGC_LIKE
UNIVERSITY UNIVERSITY
OTHERS OTHERS
AOJ_COURSES AOJ_COURSES
AOJ_PCK AOJ_PCK
AOJ_JAG AOJ_JAG
        }
    


        TaskGrade {
            PENDING PENDING
Q11 Q11
Q10 Q10
Q9 Q9
Q8 Q8
Q7 Q7
Q6 Q6
Q5 Q5
Q4 Q4
Q3 Q3
Q2 Q2
Q1 Q1
D1 D1
D2 D2
D3 D3
D4 D4
D5 D5
D6 D6
        }
    


        AtcoderProblemsDifficulty {
            PENDING PENDING
UNAVAILABLE UNAVAILABLE
GRAY GRAY
BROWN BROWN
GREEN GREEN
CYAN CYAN
BLUE BLUE
YELLOW YELLOW
ORANGE ORANGE
RED RED
BRONZE BRONZE
SILVER SILVER
GOLD GOLD
        }
    


        WorkBookType {
            CREATED_BY_USER CREATED_BY_USER
CURRICULUM CURRICULUM
SOLUTION SOLUTION
TEXTBOOK TEXTBOOK
GENRE GENRE
THEME THEME
OTHERS OTHERS
        }
    
  "user" {
    String id "🗝️"
    String username 
    Roles role 
    String atcoder_validation_code 
    String atcoder_username 
    Boolean atcoder_validation_status "❓"
    DateTime created_at 
    DateTime updated_at 
    }
  

  "session" {
    String id "🗝️"
    String user_id 
    BigInt active_expires 
    BigInt idle_expires 
    }
  

  "key" {
    String id "🗝️"
    String hashed_password "❓"
    String user_id 
    }
  

  "task" {
    String id "🗝️"
    ContestType contest_type 
    String contest_id 
    String task_table_index 
    String task_id 
    String title 
    TaskGrade grade 
    AtcoderProblemsDifficulty atcoder_problems_difficulty 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "tag" {
    String id "🗝️"
    Boolean is_published 
    Boolean is_official 
    String name 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "tasktag" {
    String id 
    String task_id "🗝️"
    String tag_id "🗝️"
    Int priority 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "taskanswer" {
    String id 
    String task_id "🗝️"
    String user_id "🗝️"
    String status_id 
    DateTime created_at 
    DateTime updated_at 
    }
  

  "submissionstatus" {
    String id "🗝️"
    String user_id "❓"
    String status_name 
    Boolean is_AC 
    String label_name 
    String image_path 
    String button_color 
    Int sort_order 
    }
  

  "workbook" {
    Int id "🗝️"
    String authorId 
    String title 
    String description 
    String editorialUrl 
    Boolean isPublished 
    Boolean isOfficial 
    Boolean isReplenished 
    WorkBookType workBookType 
    DateTime createdAt 
    DateTime updatedAt 
    }
  

  "workbooktask" {
    String id "🗝️"
    Int workBookId 
    String taskId 
    Int priority 
    String comment 
    DateTime createdAt 
    DateTime updatedAt 
    }
  
    "user" o|--|| "Roles" : "enum:role"
    "user" o{--}o "session" : "auth_session"
    "user" o{--}o "key" : "key"
    "user" o{--}o "taskanswer" : "taskAnswer"
    "user" o{--}o "workbook" : "workBooks"
    "session" o|--|| "user" : "user"
    "key" o|--|| "user" : "user"
    "task" o|--|| "ContestType" : "enum:contest_type"
    "task" o|--|| "TaskGrade" : "enum:grade"
    "task" o|--|| "AtcoderProblemsDifficulty" : "enum:atcoder_problems_difficulty"
    "task" o{--}o "tasktag" : "tags"
    "task" o{--}o "taskanswer" : "task_answers"
    "task" o{--}o "workbooktask" : "workBookTasks"
    "tag" o{--}o "tasktag" : "tasks"
    "tasktag" o|--|o "task" : "task"
    "tasktag" o|--|o "tag" : "tag"
    "taskanswer" o|--|o "task" : "task"
    "taskanswer" o|--|o "user" : "user"
    "taskanswer" o|--|o "submissionstatus" : "status"
    "submissionstatus" o{--}o "taskanswer" : "task_answer"
    "workbook" o|--|| "WorkBookType" : "enum:workBookType"
    "workbook" o|--|| "user" : "user"
    "workbook" o{--}o "workbooktask" : "workBookTasks"
    "workbooktask" o|--|| "workbook" : "workBook"
    "workbooktask" o|--|| "task" : "task"
```
