/**
 * Some comments
 * ! alert 
 */
public class SelectableAsset
{
    // * note
    public Asset asset {get; set;}

    public Boolean selected {get; set;}     

    public SelectableAsset(Asset ast)
    {
        asset = ast;
        
        // TODO add more
        selected = false;
    }

}