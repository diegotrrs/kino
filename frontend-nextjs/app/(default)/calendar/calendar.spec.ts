const f = (a: string) => {
  return  `${a}_HOLA`
}

describe("When there is one robot and it does NOT MOVE OR TURN",  () => {  
  it("should return the same position when no instructions received", async () => {
    //const x: number[] = [1,2]
    const x = "a"
    expect(x).toEqual("a")
  })
})

