import json
import secrets


def sample_unique(start, end, count):
    pool = list(range(start, end + 1))
    chosen = []
    for _ in range(count):
        index = secrets.randbelow(len(pool))
        chosen.append(pool.pop(index))
    return sorted(chosen)


def generate():
    return {
        "redBalls": [f"{number:02d}" for number in sample_unique(1, 9, 6)],
        "blueBall": f"{secrets.randbelow(8) + 1:02d}",
    }


if __name__ == "__main__":
    print(json.dumps(generate(), ensure_ascii=False))
