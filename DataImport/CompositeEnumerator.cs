using System.Collections;

namespace DataImport;

public class CompositeEnumerator<T> : IEnumerator<T>
{
    private readonly IEnumerator<T>[] _enumerators;
    private int _index;

    public CompositeEnumerator(params IEnumerator<T>[] enumerators)
    {
        _enumerators = enumerators.ToArray();
    }

    public bool MoveNext()
    {
        if (CurrentEnumerator == null)
        {
            return false;
        }

        if (CurrentEnumerator.MoveNext())
        {
            return true;
        }

        _index++;
        return CurrentEnumerator?.MoveNext() == true;
    }

    public void Reset()
    {
        foreach (var enumerator in _enumerators)
        {
            enumerator.Reset();
        }

        _index = 0;
    }

#pragma warning disable CS8603
    public T Current => CurrentEnumerator == null ? default : CurrentEnumerator.Current;
#pragma warning restore CS8603
#pragma warning disable CS8603
    object IEnumerator.Current => Current;
#pragma warning restore CS8603

    public void Dispose()
    {
        foreach (var enumerator in _enumerators)
        {
            enumerator.Dispose();
        }
    }

    private IEnumerator<T>? CurrentEnumerator => _index >= _enumerators.Length
        ? _enumerators[_index]
        : null;
}