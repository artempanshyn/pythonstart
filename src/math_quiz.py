"""Навчальна вікторина тренажера PythonStart."""


def check_answer(user_answer, correct_answer):
    """Перевіряє відповідь без урахування регістру й крайніх пробілів."""
    return user_answer.strip().lower() == correct_answer.strip().lower()


def run_quiz():
    """Запускає опитування з основ Python."""
    print("=== Вітаємо у тренажері PythonStart! ===")
    score = 0

    ans1 = input("1. Яка функція в Python виводить текст на екран? (без дужок): ")
    if check_answer(ans1, "print"):
        print("Правильно! Молодець!\n")
        score += 1
    else:
        print("Помилка. Правильна відповідь: print\n")

    ans2 = input("2. Який символ присвоює значення змінній у Python? ")
    if check_answer(ans2, "="):
        print("Правильно! Чудова робота!\n")
        score += 1
    else:
        print("Помилка. Правильна відповідь: =\n")

    print(f"Вікторину завершено! Ваш результат: {score} з 2 балів.")


if __name__ == "__main__":
    run_quiz()
