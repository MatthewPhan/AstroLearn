import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
import datetime
import random
import uvicorn
import os
from pyngrok import ngrok

# --- Define the Q-Network ---
class QNet(nn.Module):
    def __init__(self, input_dim, output_dim):
        super(QNet, self).__init__()
        self.fc1 = nn.Linear(input_dim, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, output_dim)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

# --- Define the Environment ---
class StudyEnv:
    def __init__(self):
        self.state = None

    def reset(self):
        # Reset the environment with random initial values
        self.state = np.array([random.uniform(5, 20), random.uniform(0.5, 1.0)], dtype=np.float32)
        return self.state

    def step(self, action):
        # Simulate the effect of an action
        review_count, new_count = action
        time_penalty = review_count * 0.1 + new_count * 0.2
        retention_bonus = self.state[1] * 10
        reward = retention_bonus - time_penalty

        # Update the state with new random values
        self.state = np.array([random.uniform(5, 20), random.uniform(0.5, 1.0)], dtype=np.float32)
        return self.state, reward

# --- Initialize Model and Environment ---
env = StudyEnv()
state_size = 2
action_space = [(1, 0), (0, 1), (1, 1), (2, 0), (0, 2)]  # Example actions
action_size = len(action_space)
qnet = QNet(state_size, action_size)
optimizer = optim.Adam(qnet.parameters(), lr=0.001)
loss_fn = nn.MSELoss()
gamma = 0.95  # Discount factor for future rewards

# --- FastAPI Setup ---
app = FastAPI()

class StudyInput(BaseModel):
    avg_time: float
    correct_ratio: float

@app.post("/study-plan")
def get_study_plan(input: StudyInput):
    env.reset()

    # Prepare the state for the model
    state = torch.tensor([input.avg_time, input.correct_ratio], dtype=torch.float32).unsqueeze(0)

    # Epsilon-greedy strategy for exploration vs. exploitation
    epsilon = 0.2  # Exploration rate
    if random.random() < epsilon:
        action_idx = random.randint(0, action_size - 1)  # Explore: choose a random action
    else:
        with torch.no_grad():
            q_values = qnet(state)
            action_idx = torch.argmax(q_values).item()  # Exploit: choose the best action

    action = action_space[action_idx]

    # Simulate the environment step
    next_state, reward = env.step(action)

    # Update the model (online learning)
    next_state = torch.tensor(next_state, dtype=torch.float32).unsqueeze(0)
    with torch.no_grad():
        target = reward + gamma * torch.max(qnet(next_state)).item()  # Bellman equation

    q_values = qnet(state)  # Compute Q-values for the current state
    loss = loss_fn(q_values[0, action_idx], torch.tensor(target))  # Calculate the loss

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    # Generate recall dates and memory retention data
    today = datetime.date.today()
    schedule = []
    recall_dates = []
    memory_retention = []
    ideal_retention = []
    forgetting_curve = []

    initial_retention = 90  # Starting memory retention percentage
    forgetting_rate = 0.1  # Forgetting rate

    for i in range(5):  # Limit to 5 review dates
        interval = action[0] + i  # Incremental intervals
        next_review_date = today + datetime.timedelta(days=interval)
        recall_dates.append(next_review_date.strftime("%Y-%m-%d"))

        # Memory retention (actual)
        retention = initial_retention * np.exp(-forgetting_rate * interval)
        memory_retention.append(max(0, retention))

        # Ideal retention (assume minimal decay)
        ideal = max(80, initial_retention - i * 5)
        ideal_retention.append(ideal)

        # Forgetting curve (no review)
        forgetting = initial_retention * np.exp(-forgetting_rate * sum(action[0] + j for j in range(i + 1)))
        forgetting_curve.append(max(0, forgetting))

        schedule.append({
            "card_id": i + 1,
            "next_review_date": next_review_date,
            "interval_days": interval
        })

    return {
        "schedule": schedule,
        "recall_dates": recall_dates,
        "memory_retention": memory_retention,
        "ideal_retention": ideal_retention,
        "forgetting_curve": forgetting_curve
    }

# --- Run the FastAPI App ---
if __name__ == "__main__":

    # Start the FastAPI app
    uvicorn.run(app, host="0.0.0.0", port=8000)