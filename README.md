# Multi Agent Debate Arena

A chaotic multi agent debate simulator built with MERN and OpenRouter.

Four AI agents enter a debate. Each holds a distinct worldview. They argue, escalate, get irritated, contradict, and sometimes lose coherence just to win. The system is not designed for polite answers. It is designed to explore conflict.

The interface takes inspiration from classic pixel era games. It feels less like a chatbot and more like a turn based encounter.

---

## What this is

This is a multi agent system where:

* One model defines four opposing positions from a single topic
* Four different models take those positions
* Each agent argues in rounds
* Agents react to each other, remember attacks, and escalate tone
* The user can interrupt and influence the debate

It is part experiment, part system design exercise, part controlled chaos.

---

## Core Features

### Position Generator

A base model acts as a debate architect.
Given a topic, it produces four distinct positions with minimal overlap.
Each position comes from a different worldview.

---

### Multi Agent Debate Engine

* Four agents speak in rounds
* Each sees previous arguments
* Each defends its position and attacks others
* Context is trimmed to keep performance stable

---

### Chaos Engine

A controlled aggression system.

* Low chaos leads to logical disagreement
* Medium chaos introduces sarcasm and tension
* High chaos leads to irritation, mockery, and breakdown of civility

Agents evolve over time and become more reactive.

---

### Interrupt System

The user can вмеш into the debate at any time.

* Inject arguments
* Challenge agents
* Get accepted, ignored, or attacked

Agents do not treat the user as authority.

---

### Personality Layer

Each agent has:

* Tone
* Stubbornness
* Aggression
* Adaptability

They are consistent across rounds and evolve based on interactions.

---

### Pixel UI

The interface is inspired by retro console games.

* Turn based message flow
* Typewriter text animation
* Active speaker highlighting
* Chaos reflected visually

It feels like watching a battle unfold rather than reading a thread.

---

## Tech Stack

Frontend
React with Vite
Zustand for state management

Backend
Node and Express

Database
MongoDB

AI Layer
OpenRouter API

Deployment
Vercel for frontend
Render for backend

---

## Project Structure

```
root/
  client/
  server/
  shared/
```

client handles UI and interaction
server runs the debate engine and API
shared holds common structures

---

## How It Works

1. User enters a topic
2. System generates four conflicting positions
3. Four agents are created using selected models
4. Debate runs in rounds
5. Agents react to each other and the user
6. Chaos level shapes tone and behavior

---

## Running Locally

### Clone

```
git clone <your-repo>
cd <your-repo>
```

---

### Setup Backend

```
cd server
npm install
```

Create `.env`

```
OPENROUTER_API_KEY=your_key
MONGO_URI=your_uri
JWT_SECRET=your_secret
```

Run:

```
npm run dev
```

---

### Setup Frontend

```
cd client
npm install
npm run dev
```

---

## Deployment

Frontend is deployed on Vercel
Backend is deployed on Render

Environment variables must be configured in both platforms.

---

## Design Philosophy

This project is not about correctness.
It is about interaction.

The goal is to simulate:

* disagreement
* bias
* escalation
* imperfect reasoning

It treats AI not as an answer engine but as a system of competing voices.

---

## Limitations

* Model responses are unpredictable
* Debates can become repetitive
* High chaos can reduce coherence
* Context window limits depth

These are part of the experiment, not bugs.

---

## Future Directions

* AI judge to evaluate debates
* Replay system for past sessions
* Multi user spectator mode
* Better memory compression

---

