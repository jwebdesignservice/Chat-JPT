# Ollama + GLM Setup Guide for Cursor

This guide will help you set up Ollama with GLM weights and connect it to Cursor IDE.

---

## Step 1: Install Ollama

### Download and Install

1. Go to: **https://ollama.ai/download**
2. Download the **Windows** installer
3. Run the installer and follow the prompts
4. Restart your terminal/PowerShell after installation

### Verify Installation

After installing, open a new PowerShell window and run:

```powershell
ollama --version
```

You should see a version number like `ollama version 0.x.x`

---

## Step 2: Pull GLM Model

Once Ollama is installed, pull the GLM-4 model:

```powershell
# Option 1: GLM-4 (5.5GB) - Recommended for most systems
ollama pull glm4

# Option 2: GLM-4.7-Flash (19GB) - Better performance, needs more RAM
ollama pull glm-4.7-flash

# Option 3: For coding specifically
ollama pull deepseek-coder:6.7b
```

### Start Ollama Server

```powershell
ollama serve
```

This starts the server on `http://localhost:11434`

---

## Step 3: Install Ngrok

Cursor cannot connect directly to localhost, so we need Ngrok as a tunnel.

### Download and Install

1. Go to: **https://ngrok.com/download**
2. Download the **Windows** version
3. Unzip to a folder (e.g., `C:\ngrok\`)
4. Add to PATH or run from the folder

### Create Ngrok Account

1. Go to: **https://dashboard.ngrok.com/signup**
2. Sign up for a free account
3. Get your **Authtoken** from: https://dashboard.ngrok.com/get-started/your-authtoken

### Configure Ngrok

```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

---

## Step 4: Start the Tunnel

Open a **new terminal** and run:

```powershell
ngrok http 11434 --host-header="localhost:11434"
```

> **Important**: The `--host-header` flag is required so Ollama accepts requests from ngrok.

You'll see output like:

```
Session Status                online
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:11434
```

**Copy the `https://...ngrok-free.app` URL** - you'll need this for Cursor.

---

## Step 5: Configure Cursor

1. Open **Cursor IDE**
2. Press `Ctrl + ,` to open Settings
3. Search for "**Models**" or go to **Cursor Settings > Models**
4. Scroll down to **OpenAI API Key** section

### Add Your Model

1. **Enable**: "Override OpenAI Base URL"
2. **Base URL**: `https://YOUR-NGROK-URL.ngrok-free.app/v1`
   - Replace with your actual Ngrok URL from Step 4
3. **API Key**: Enter any text (e.g., `ollama`)
4. **Model**: Add custom model name: `glm4`

### Select the Model

In the model dropdown (top of chat), select your custom model.

---

## Step 6: Test It

1. Open Cursor chat (`Ctrl + L`)
2. Make sure your custom model is selected
3. Ask a coding question

---

## Running Daily

Every time you want to use local LLM in Cursor:

### Terminal 1: Start Ollama
```powershell
ollama serve
```

### Terminal 2: Start Ngrok
```powershell
ngrok http 11434 --host-header="localhost:11434"
```

**Note**: With free Ngrok, the URL changes each restart. Update Cursor settings with the new URL.

---

## Troubleshooting

### "Model not found"
- Make sure you pulled the model: `ollama list`
- Model name in Cursor must match exactly (e.g., `glm4`)

### "Connection refused"
- Make sure `ollama serve` is running
- Check Ngrok is running and forwarding to port 11434

### Slow responses
- GLM-4 needs ~8GB RAM
- GLM-4.7-Flash needs ~16GB RAM
- Consider using smaller models like `deepseek-coder:6.7b`

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `ollama pull glm4` | Download GLM-4 model |
| `ollama serve` | Start Ollama server |
| `ollama list` | List downloaded models |
| `ollama run glm4` | Test model in terminal |
| `ngrok http 11434 --host-header="localhost:11434"` | Create tunnel for Cursor |

---

## Recommended Models for Coding

| Model | Size | RAM Needed | Command |
|-------|------|------------|---------|
| deepseek-coder:6.7b | 4GB | 8GB | `ollama pull deepseek-coder:6.7b` |
| glm4 | 5.5GB | 10GB | `ollama pull glm4` |
| codellama:7b | 4GB | 8GB | `ollama pull codellama:7b` |
| glm-4.7-flash | 19GB | 24GB | `ollama pull glm-4.7-flash` |
