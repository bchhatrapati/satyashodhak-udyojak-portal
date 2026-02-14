from sqlalchemy.orm import Session
from sqlalchemy import text

def generate_next_account_number(db: Session) -> str:
    # 1. Fetch and Lock the tracker row
    sql = text("SELECT last_sequence_number, is_reverse_phase FROM id_tracker WHERE id = 1 FOR UPDATE")
    result = db.execute(sql).fetchone()
    
    # Initialization if table is empty
    if not result:
        db.execute(text("INSERT INTO id_tracker (id, last_sequence_number, is_reverse_phase) VALUES (1, 10001, true)"))
        last_num, is_reverse = 10001, True
    else:
        last_num, is_reverse = result

    # 2. Business Logic with the Safety Switch
    if is_reverse:
        if last_num > 1:
            next_num = last_num - 1
            new_reverse_status = True
        else:
            # We reached 00001! Time to flip the switch for the next person
            next_num = 10001
            new_reverse_status = False
    else:
        # Standard forward counting
        next_num = last_num + 1
        new_reverse_status = False

    # 3. Update the tracker with the new number AND the new status
    db.execute(
        text("UPDATE id_tracker SET last_sequence_number = :val, is_reverse_phase = :rev WHERE id = 1"),
        {"val": next_num, "rev": new_reverse_status}
    )
    
    return f"SUCCS{next_num:05d}"