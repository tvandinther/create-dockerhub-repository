# Create Docker Hub Repository
A GitHub Action to idempotently create a Docker Hub repository.

## Inputs

| Name | Description | Required | Default |
| --- | --- | --- | --- |
| `namespace` | The username of the Docker Hub account. | **required** | - |
| `repository` | The name of the repository. | **required** | - |
| `private` | Whether the repository should be private. | **optional** | `false` |
| `description` | Whether the repository should be private. | **optional** | `""` |
| `full_description_path` | The path to a text or markdown file containing the full description of the repository. Path is relative to the repository root. | **optional** | `""` |
| `token` | The Docker Hub token to use for authentication.  | **required** | - |

## Example Usage
    
```yaml
- name: Create Docker Hub Repository
  uses: create-dockerhub-repository@v1
  with:
    namespace: 'tvandinther'
    repository: 'myapp'
    private: true
    description: 'This is my app.'
    full_description_path: 'README.md'
    token: ${{ secrets.DOCKER_HUB_TOKEN }}
```

## Notes

### Caveats with idempotence
`private` only has an effect during repository creation.