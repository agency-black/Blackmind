// clean workflow
``` 
gh run list --limit 100 --status completed --json databaseId --jq ".[].databaseId" | xargs -I {} gh run delete {} 
```

// clean artifacts

```
gh api repos/Lucassssss/ee.chat/actions/artifacts --jq ".artifacts[].id" | xargs -I {} gh api --method DELETE repos/Lucassssss/ee.chat/actions/artifacts/{}
```