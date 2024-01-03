import pymysql

# 代码检查  sql注入攻击
def login(username, password):
    conn = pymysql.connect(host='localhost', port=3306, user='root', password='123456', db='users')
    cursor = conn.cursor()
    sql = "SELECT * FROM user WHERE username='%s' AND password='%s'" % (username, password)
    cursor.execute(sql)
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result

# 代码检查 栈溢出攻击
int vul2()
