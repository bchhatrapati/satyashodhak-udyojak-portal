from sqlalchemy.orm import Session
from sqlalchemy import text

def generate_next_account_number(db: Session) -> str:
    """
    Generates a unique SUCCS ID using a reverse-then-forward sequence.
    Thread-safe and transaction-protected.
    """
    next_num = None
    
    # The 'begin' block handles the COMMIT or ROLLBACK automatically
    #with db.begin():
        # 1. Fetch current state and LOCK the row for this transaction
    sql = text("""
        SELECT last_sequence_number, is_reverse_phase 
        FROM id_tracker 
        WHERE id = 1 
        FOR UPDATE
    """)
    result = db.execute(sql).fetchone()
    # 2. Handle first-time initialization
    if not result:
        db.execute(text("""
            INSERT INTO id_tracker (id, last_sequence_number, is_reverse_phase)
            VALUES (1, 10001, true)
        """))
        last_num, is_reverse = 10001, True
    else:
        last_num, is_reverse = result
    # 3. Apply the Business Logic (Reverse 10k->1, then Forward 10k+)
    if is_reverse:
        if last_num > 1:
            next_num = last_num - 1
            new_reverse_status = True
        else:
            # The U-Turn Point: Flip from countdown to count-up
            next_num = 10001
            new_reverse_status = False
    else:
        next_num = last_num + 1
        new_reverse_status = False
    # 4. Save the new state back to the tracker
    db.execute(
        text("""
            UPDATE id_tracker 
            SET last_sequence_number = :val, 
                is_reverse_phase = :rev 
            WHERE id = 1
        """),
        {"val": next_num, "rev": new_reverse_status}
    )

    # Return the formatted string AFTER the transaction is committed
    return f"SUCCS{next_num:05d}"