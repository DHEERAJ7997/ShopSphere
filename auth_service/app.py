from flask import Flask, request, jsonify
import jwt
import datetime

app = Flask(__name__)

# This key is what the API Gateway will use later to verify the token is real.// first initial step
SECRET_KEY = "super_secret_shop_key"


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Missing username or password"}), 400

    # Hardcoded check for Phase 1 testing
    if data["username"] == "admin" and data["password"] == "password123":

        # CREATE THE JWT
        payload = {
            "user": data["username"],
            "role": "customer",
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return jsonify({"token": token})

    return jsonify({"message": "Invalid credentials"}), 401


if __name__ == "__main__":
    # Running on port 5001 so it doesn't conflict with the Gateway later
    app.run(port=5001, debug=True)
